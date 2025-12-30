# Integrasi OIDC Client - Laravel

Panduan untuk mengintegrasikan aplikasi Laravel dengan SSO IdP menggunakan OpenID Connect.

## Prerequisites

- Laravel 9+
- PHP 8.1+
- Composer

## Instalasi

### Menggunakan Laravel Socialite

```bash
composer require laravel/socialite
composer require socialiteproviders/openid-connect
```

### Konfigurasi

1. **Tambah service provider** di `config/app.php`:

```php
'providers' => [
    // ...
    \SocialiteProviders\Manager\ServiceProvider::class,
],
```

2. **Setup environment** di `.env`:

```env
# SSO OIDC Configuration
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_REDIRECT_URI=https://your-app.com/auth/callback
SSO_ISSUER=https://sso.company.local

# Optional: jika issuer berbeda dengan base URL
SSO_AUTHORIZE_URL=https://sso.company.local/oidc/auth
SSO_TOKEN_URL=https://sso.company.local/oidc/token
SSO_USERINFO_URL=https://sso.company.local/oidc/userinfo
```

3. **Tambah konfigurasi** di `config/services.php`:

```php
'sso' => [
    'client_id' => env('SSO_CLIENT_ID'),
    'client_secret' => env('SSO_CLIENT_SECRET'),
    'redirect' => env('SSO_REDIRECT_URI'),
    'issuer' => env('SSO_ISSUER'),
],
```

4. **Buat custom provider** di `app/Providers/SsoProvider.php`:

```php
<?php

namespace App\Providers;

use SocialiteProviders\Manager\OAuth2\AbstractProvider;
use SocialiteProviders\Manager\OAuth2\User;
use Illuminate\Support\Arr;

class SsoProvider extends AbstractProvider
{
    public const IDENTIFIER = 'SSO';

    protected $scopes = ['openid', 'profile', 'email', 'roles'];
    protected $scopeSeparator = ' ';
    protected $usesPKCE = true; // Enable PKCE

    protected function getAuthUrl($state): string
    {
        return $this->buildAuthUrlFromBase(
            config('services.sso.issuer') . '/oidc/auth',
            $state
        );
    }

    protected function getTokenUrl(): string
    {
        return config('services.sso.issuer') . '/oidc/token';
    }

    protected function getUserByToken($token): array
    {
        $response = $this->getHttpClient()->get(
            config('services.sso.issuer') . '/oidc/userinfo',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json',
                ],
            ]
        );

        return json_decode($response->getBody()->getContents(), true);
    }

    protected function mapUserToObject(array $user): User
    {
        return (new User())->setRaw($user)->map([
            'id' => $user['sub'],
            'nickname' => $user['preferred_username'] ?? null,
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'employee_id' => $user['employee_id'] ?? null,
            'roles' => $user['roles'] ?? [],
        ]);
    }
    
    // Override untuk support PKCE
    protected function getCodeVerifier(): string
    {
        return $this->request->session()->get('code_verifier');
    }
    
    protected function getCodeChallenge(): string
    {
        $verifier = bin2hex(random_bytes(32));
        $this->request->session()->put('code_verifier', $verifier);
        
        $challenge = strtr(rtrim(
            base64_encode(hash('sha256', $verifier, true)),
            '='
        ), '+/', '-_');
        
        return $challenge;
    }
    
    protected function getCodeChallengeMethod(): string
    {
        return 'S256';
    }
}
```

5. **Register provider** di `app/Providers/EventServiceProvider.php`:

```php
protected $listen = [
    \SocialiteProviders\Manager\SocialiteWasCalled::class => [
        [\App\Providers\SsoProvider::class.'@handle'],
    ],
];
```

## Routes

Tambahkan routes di `routes/web.php`:

```php
use App\Http\Controllers\Auth\SsoController;

Route::get('/auth/sso', [SsoController::class, 'redirect'])->name('sso.redirect');
Route::get('/auth/callback', [SsoController::class, 'callback'])->name('sso.callback');
Route::post('/auth/logout', [SsoController::class, 'logout'])->name('sso.logout');
```

## Controller

Buat controller di `app/Http/Controllers/Auth/SsoController.php`:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SsoController extends Controller
{
    /**
     * Redirect ke SSO IdP
     */
    public function redirect()
    {
        return Socialite::driver('sso')
            ->with([
                'code_challenge' => $this->generateCodeChallenge(),
                'code_challenge_method' => 'S256',
            ])
            ->redirect();
    }

    /**
     * Handle callback dari SSO IdP
     */
    public function callback(Request $request)
    {
        try {
            $ssoUser = Socialite::driver('sso')->user();

            // Cari atau buat user lokal
            $user = User::updateOrCreate(
                ['email' => $ssoUser->getEmail()],
                [
                    'name' => $ssoUser->getName(),
                    'employee_id' => $ssoUser->employee_id,
                    'sso_id' => $ssoUser->getId(),
                ]
            );

            // Sync roles jika diperlukan
            if (!empty($ssoUser->roles)) {
                $this->syncUserRoles($user, $ssoUser->roles);
            }

            // Login user
            Auth::login($user, true);

            return redirect()->intended('/dashboard');

        } catch (\Exception $e) {
            report($e);
            return redirect('/login')
                ->with('error', 'SSO authentication failed. Please try again.');
        }
    }

    /**
     * Logout dari SSO
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect ke SSO logout endpoint
        $logoutUrl = config('services.sso.issuer') . '/oidc/session/end';
        $redirectUri = urlencode(config('app.url'));
        
        return redirect("{$logoutUrl}?post_logout_redirect_uri={$redirectUri}");
    }

    /**
     * Sync user roles dari SSO ke lokal
     */
    protected function syncUserRoles(User $user, array $ssoRoles): void
    {
        // Map SSO roles ke local roles
        $roleMapping = [
            'superadmin' => 'admin',
            'admin' => 'manager',
            'user' => 'member',
        ];

        $localRoles = [];
        foreach ($ssoRoles as $ssoRole) {
            if (isset($roleMapping[$ssoRole])) {
                $localRoles[] = $roleMapping[$ssoRole];
            }
        }

        // Sync dengan role management library (Spatie, Bouncer, etc.)
        // $user->syncRoles($localRoles);
    }

    /**
     * Generate PKCE code challenge
     */
    protected function generateCodeChallenge(): string
    {
        $verifier = bin2hex(random_bytes(32));
        session(['code_verifier' => $verifier]);

        return strtr(rtrim(
            base64_encode(hash('sha256', $verifier, true)),
            '='
        ), '+/', '-_');
    }
}
```

## User Model

Update model `User` jika perlu:

```php
// app/Models/User.php

protected $fillable = [
    'name',
    'email',
    'password',
    'employee_id',
    'sso_id',
];

protected $hidden = [
    'password',
    'remember_token',
];
```

## Migration

Buat migration untuk kolom tambahan:

```bash
php artisan make:migration add_sso_fields_to_users_table
```

```php
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('employee_id')->nullable()->after('email');
        $table->string('sso_id')->nullable()->after('employee_id');
        $table->string('password')->nullable()->change(); // Password optional untuk SSO users
    });
}
```

## Middleware untuk Protect Routes

Buat middleware untuk verify SSO session:

```php
// app/Http/Middleware/VerifySsoSession.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifySsoSession
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check()) {
            return redirect()->route('sso.redirect');
        }

        // Optional: verify token masih valid dengan introspection
        // $this->verifyToken($request);

        return $next($request);
    }
}
```

Register di `app/Http/Kernel.php`:

```php
protected $routeMiddleware = [
    // ...
    'sso' => \App\Http\Middleware\VerifySsoSession::class,
];
```

## View - Login Button

```blade
<!-- resources/views/auth/login.blade.php -->

<div class="flex justify-center">
    <a href="{{ route('sso.redirect') }}" 
       class="btn btn-primary">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
        Login dengan SSO
    </a>
</div>
```

## Testing

### Verifikasi Konfigurasi

```bash
php artisan tinker

# Test SSO endpoint
$client = new \GuzzleHttp\Client();
$response = $client->get(env('SSO_ISSUER') . '/.well-known/openid-configuration');
print_r(json_decode($response->getBody(), true));
```

### Login Flow Test

1. Akses `/auth/sso` di browser
2. Akan redirect ke SSO login page
3. Login dengan credentials
4. Approve consent (jika diminta)
5. Redirect kembali ke `/auth/callback`
6. Cek user sudah login di aplikasi

## Troubleshooting

### Error: "Invalid redirect URI"

Pastikan `SSO_REDIRECT_URI` di `.env` **persis sama** dengan yang didaftarkan di SSO Admin.

### Error: "PKCE verification failed"

- Pastikan session berjalan dengan benar
- Cek `code_verifier` tersimpan di session
- Pastikan menggunakan HTTPS di production

### Error: "Invalid client credentials"

- Verifikasi `SSO_CLIENT_ID` dan `SSO_CLIENT_SECRET`
- Cek client masih active di SSO Admin

### User tidak punya roles

- Pastikan scope `roles` diminta saat authorize
- Cek user memiliki roles di SSO Admin
