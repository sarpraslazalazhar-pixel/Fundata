<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\Auth\UserLoginController;
use App\Http\Controllers\Auth\AdminLoginController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Admin\SystemConfigController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\Api\DropdownController;

Route::get('/', HomeController::class);

Route::get('/system/notification-sound', [\App\Http\Controllers\Admin\SystemConfigController::class, 'serveNotificationSound'])->name('system.notification-sound');

Route::middleware('guest')->group(function () {
    Route::get('login', [UserLoginController::class, 'showLoginForm'])->name('login');
    Route::post('login', [UserLoginController::class, 'login'])->middleware('throttle:5,1');
    
    Route::get('register', [RegisterController::class, 'showForm'])->name('register');

    // Lupa Password
    Route::get('/lupa-password', [ForgotPasswordController::class, 'showForm'])->name('password.request');
    Route::post('/lupa-password', [ForgotPasswordController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [ForgotPasswordController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword'])->name('password.update');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [UserLoginController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Data Input Wizard
    Route::get('/data/buat', [\App\Http\Controllers\User\DataInputController::class, 'create'])->name('data.create');
    Route::post('/data', [\App\Http\Controllers\User\DataInputController::class, 'store'])->name('data.store');

    // Data History
    Route::get('/data/saya', [\App\Http\Controllers\User\MyDataController::class, 'index'])->name('data.riwayat');
    Route::get('/data/{record}', [\App\Http\Controllers\User\MyDataController::class, 'show'])->name('data.show');
    Route::post('/data/{record}/reply', [\App\Http\Controllers\User\MyDataController::class, 'reply'])->name('data.reply');
    Route::post('/data/{record}/accept-result', [\App\Http\Controllers\User\MyDataController::class, 'acceptResult'])->name('data.accept-result');
    Route::post('/data/{record}/request-revision', [\App\Http\Controllers\User\MyDataController::class, 'requestRevision'])->name('data.request-revision');
    Route::patch('/data/{record}/batal', [\App\Http\Controllers\User\MyDataController::class, 'cancel'])->name('data.batal');
    Route::get('/data/download/{attachment}', [\App\Http\Controllers\User\MyDataController::class, 'download'])->name('data.download');
    Route::get('/data/view/{attachment}', [\App\Http\Controllers\User\MyDataController::class, 'viewAttachment'])->name('data.view');

    // Profil User
    Route::put('/profil', [\App\Http\Controllers\User\ProfileController::class, 'update'])->name('profil.update');
    Route::post('/profil/avatar', [\App\Http\Controllers\User\ProfileController::class, 'uploadAvatar'])->name('profil.upload-avatar');

    // User Messaging Page
    Route::get('/pesan', [\App\Http\Controllers\MessageController::class, 'userIndex'])->name('pesan.index');

    // Notifications (User)
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('unread-count', [\App\Http\Controllers\User\NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::get('/', [\App\Http\Controllers\User\NotificationController::class, 'index'])->name('index');
        Route::patch('{id}/read', [\App\Http\Controllers\User\NotificationController::class, 'markAsRead'])->name('read');
        Route::patch('{id}/snooze', [\App\Http\Controllers\User\NotificationController::class, 'snooze'])->name('snooze');
        Route::patch('{id}/done', [\App\Http\Controllers\User\NotificationController::class, 'markAsDone'])->name('done');
        Route::post('mark-all-read', [\App\Http\Controllers\User\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
    });
});

// Shared Messaging API (User & Admin)
Route::middleware('auth:web,admin')->group(function () {
    Route::get('/api/messages/contacts', [\App\Http\Controllers\MessageController::class, 'contacts']);
    Route::get('/api/messages/context-options', [\App\Http\Controllers\MessageController::class, 'contextOptions']);
    Route::get('/api/messages/{userId}', [\App\Http\Controllers\MessageController::class, 'fetchMessages']);
    Route::post('/api/messages/{userId}/read', [\App\Http\Controllers\MessageController::class, 'markAsRead']);
    Route::post('/api/messages', [\App\Http\Controllers\MessageController::class, 'store']);
});

// API dropdown (dependent dropdown & dynamic form)
Route::prefix('api')->middleware('auth:web,admin')->group(function () {
    Route::get('/org-units/{divisiId}', [DropdownController::class, 'orgUnits'])->name('api.org-units');
    Route::get('/sub-units/{unitId}', [DropdownController::class, 'subUnits'])->name('api.sub-units');
    Route::get('/form-fields/{subUnitId}', [DropdownController::class, 'formFields'])->name('api.form-fields');
    
    // ponytail: added throttle middleware to donatur search to prevent scraping / PII leak
    Route::get('/donatur/search', [\App\Http\Controllers\Api\DonaturController::class, 'search'])->middleware('throttle:30,1')->name('api.donatur.search');
    Route::post('/donatur/quick-store', [\App\Http\Controllers\Api\DonaturController::class, 'quickStore'])->name('api.donatur.quick-store');
});

// Web Push Subscriptions
Route::post('/push/subscribe', [\App\Http\Controllers\WebPushController::class, 'subscribe'])->name('push.subscribe');
Route::post('/push/unsubscribe', [\App\Http\Controllers\WebPushController::class, 'unsubscribe'])->name('push.unsubscribe');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest:admin')->group(function () {
        Route::get('login', [AdminLoginController::class, 'showLoginForm'])->name('login');
        Route::post('login', [AdminLoginController::class, 'login'])->middleware('throttle:5,1');
    });

    Route::middleware('auth:admin')->group(function () {
        Route::post('logout', [AdminLoginController::class, 'logout'])->name('logout');
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/donasi-cabang/{divisiId?}/{orgUnitId?}', [\App\Http\Controllers\Admin\DashboardController::class, 'getDonaturByCabang'])->name('dashboard.donasi-cabang');
        
        Route::get('/pesan', [\App\Http\Controllers\MessageController::class, 'adminIndex'])->name('pesan.index');

        // Profil Admin
        Route::put('/profil', [\App\Http\Controllers\Admin\ProfileController::class, 'update'])->name('profil.update');
        Route::post('/profil/avatar', [\App\Http\Controllers\Admin\ProfileController::class, 'uploadAvatar'])->name('profil.upload-avatar');

        Route::middleware('permission:akses-laporan')->group(function () {
            Route::get('/laporan/data', [\App\Http\Controllers\Admin\LaporanDataController::class, 'index'])->name('laporan.data');
            Route::get('/laporan/data/export', [\App\Http\Controllers\Admin\LaporanDataController::class, 'export'])->name('laporan.data.export');
        });


        // Maintenance Cache (Shared Hosting) - hanya admin dengan akses konfigurasi
        Route::middleware('permission:akses-konfigurasi')->prefix('system')->group(function () {
            Route::post('/optimize', function () {
                Artisan::call('config:cache');
                Artisan::call('route:cache');
                Artisan::call('view:cache');
                return back()->with('success', 'Cache berhasil dioptimalkan (config, route, view).');
            })->name('system.optimize');

            Route::post('/clear', function () {
                Artisan::call('config:clear');
                Artisan::call('route:clear');
                Artisan::call('view:clear');
                Artisan::call('cache:clear');
                return back()->with('success', 'Semua cache berhasil dibersihkan.');
            })->name('system.clear');
        });

        // Konfigurasi Sistem
        Route::middleware('permission:akses-konfigurasi')->group(function () {
            Route::get('/konfigurasi', [SystemConfigController::class, 'index'])->name('konfigurasi.index');
            Route::put('/konfigurasi', [SystemConfigController::class, 'update'])->name('konfigurasi.update');
            Route::post('/konfigurasi/upload-logo', [SystemConfigController::class, 'uploadLogo'])->name('konfigurasi.upload-logo');
            Route::post('/konfigurasi/upload-banner', [SystemConfigController::class, 'uploadBanner'])->name('konfigurasi.upload-banner');
            Route::post('/konfigurasi/upload-favicon', [SystemConfigController::class, 'uploadFavicon'])->name('konfigurasi.upload-favicon');
            Route::post('/konfigurasi/upload-sound', [SystemConfigController::class, 'uploadSound'])->name('konfigurasi.upload-sound');
        });

        // Manajemen Akun
        Route::middleware('permission:akses-manajemen-akun')->group(function () {
            // Manajemen Operator
            Route::resource('manajemen-operator', AdminManagementController::class)->except(['create', 'edit', 'show'])->names('manajemen-operator');
            
            // Manajemen User
            Route::resource('manajemen-user', UserManagementController::class)->except(['create', 'edit', 'show'])->names('manajemen-user');
            
            // Manajemen Peran
            Route::resource('manajemen-peran', \App\Http\Controllers\Admin\RoleManagementController::class)->except(['create', 'edit', 'show'])->names('manajemen-peran');
        });

        // Master Data Layanan
        Route::middleware('permission:akses-layanan')->group(function () {
            Route::resource('master/unit', \App\Http\Controllers\Admin\UnitController::class)->except(['create', 'edit', 'show'])->names('master.unit');
            Route::resource('master/sub-unit', \App\Http\Controllers\Admin\SubUnitController::class)->except(['create', 'edit', 'show'])->names('master.sub-unit');
            Route::resource('master/metode-pembayaran', \App\Http\Controllers\Admin\PaymentMethodController::class)->except(['create', 'edit', 'show'])->names('master.metode-pembayaran');
            Route::resource('master/campaigns', \App\Http\Controllers\Admin\CampaignController::class)->except(['create', 'edit', 'show'])->names('master.campaigns');
            Route::resource('master/akad', \App\Http\Controllers\Admin\AkadController::class)->except(['create', 'edit', 'show'])->names('master.akad');

            // Log Audit: siapa saja yang menginput data per campaign / akad
            Route::get('master/campaigns/{campaign}/log-audit', [\App\Http\Controllers\Admin\LogAuditController::class, 'campaign'])->name('master.campaigns.log-audit');
            Route::get('master/campaigns/{campaign}/log-audit/export', [\App\Http\Controllers\Admin\LogAuditController::class, 'exportCampaign'])->name('master.campaigns.log-audit.export');
            Route::get('master/akad/{akad}/log-audit', [\App\Http\Controllers\Admin\LogAuditController::class, 'akad'])->name('master.akad.log-audit');
            Route::get('master/akad/{akad}/log-audit/export', [\App\Http\Controllers\Admin\LogAuditController::class, 'exportAkad'])->name('master.akad.log-audit.export');

            Route::get('donatur/import/template', [\App\Http\Controllers\Admin\DonaturController::class, 'importTemplate'])->name('donatur.import.template');
            Route::post('donatur/import/preview', [\App\Http\Controllers\Admin\DonaturController::class, 'importPreview'])->name('donatur.import.preview');
            Route::post('donatur/import/confirm', [\App\Http\Controllers\Admin\DonaturController::class, 'importConfirm'])->name('donatur.import.confirm');
            Route::get('donatur/{donatur}/history', [\App\Http\Controllers\Admin\DonaturController::class, 'history'])->name('donatur.history');
            Route::patch('donatur/{donatur}/approve', [\App\Http\Controllers\Admin\DonaturController::class, 'approve'])->name('donatur.approve');
            Route::resource('donatur', \App\Http\Controllers\Admin\DonaturController::class)->except(['create', 'edit', 'show'])->names('donatur');
        });

        // Master Data Struktur
        Route::middleware('permission:akses-struktur')->group(function () {
            Route::resource('master/divisi', \App\Http\Controllers\Admin\DivisiController::class)->except(['create', 'edit', 'show'])->names('master.divisi');
            Route::resource('master/unit-organisasi', \App\Http\Controllers\Admin\UnitOrganisasiController::class)->except(['create', 'edit', 'show'])->names('master.unit-organisasi');
            Route::post('master/jabatan/reorder', [\App\Http\Controllers\Admin\JabatanController::class, 'reorder'])->name('master.jabatan.reorder');
            Route::resource('master/jabatan', \App\Http\Controllers\Admin\JabatanController::class)->except(['create', 'edit', 'show'])->names('master.jabatan');
        });

        // Peraturan Form
        Route::middleware('permission:akses-konfigurasi')->group(function () {
            Route::prefix('peraturan-form')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\FormFieldController::class, 'index'])->name('peraturan-form.index');
                Route::get('/{subUnit}/builder', [\App\Http\Controllers\Admin\FormFieldController::class, 'builder'])->name('peraturan-form.builder');
                Route::post('/{subUnit}/fields', [\App\Http\Controllers\Admin\FormFieldController::class, 'store'])->name('peraturan-form.store');
                Route::put('/fields/{formField}', [\App\Http\Controllers\Admin\FormFieldController::class, 'update'])->name('peraturan-form.update');
                Route::delete('/fields/{formField}', [\App\Http\Controllers\Admin\FormFieldController::class, 'destroy'])->name('peraturan-form.destroy');
                Route::post('/{subUnit}/reorder', [\App\Http\Controllers\Admin\FormFieldController::class, 'reorder'])->name('peraturan-form.reorder');
            });

            // Reminder Config
            Route::get('reminder-config', [\App\Http\Controllers\Admin\ReminderConfigController::class, 'index'])->name('reminder-config.index');
            Route::put('reminder-config', [\App\Http\Controllers\Admin\ReminderConfigController::class, 'update'])->name('reminder-config.update');
        });

        // Notifications
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('unread-count', [\App\Http\Controllers\Admin\NotificationController::class, 'unreadCount'])->name('unread-count');
            Route::get('/', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('index');
            Route::patch('{id}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead'])->name('read');
            Route::patch('{id}/snooze', [\App\Http\Controllers\Admin\NotificationController::class, 'snooze'])->name('snooze');
            Route::patch('{id}/done', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsDone'])->name('done');
            Route::post('mark-all-read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
        });

        // Dashboard Void
        Route::middleware('permission:akses-void-approval')->group(function () {
            Route::get('/void', [\App\Http\Controllers\Admin\VoidController::class, 'index'])->name('void.index');
        });

        // Verifikasi Data Admin
        Route::prefix('verifikasi-data')->name('data.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\DataVerificationController::class, 'index'])->name('index');
            Route::get('/download/{attachment}', [\App\Http\Controllers\Admin\DataVerificationController::class, 'downloadAttachment'])->name('download');
            Route::get('/view/{attachment}', [\App\Http\Controllers\Admin\DataVerificationController::class, 'viewAttachment'])->name('view');
            Route::get('/{record}', [\App\Http\Controllers\Admin\DataVerificationController::class, 'show'])->name('show');
            Route::patch('/{record}/assign', [\App\Http\Controllers\Admin\DataVerificationController::class, 'assignOperator'])->name('assign');
            Route::patch('/{record}/status', [\App\Http\Controllers\Admin\DataVerificationController::class, 'updateStatus'])->name('status');
            Route::patch('/{record}/priority', [\App\Http\Controllers\Admin\DataVerificationController::class, 'updatePriority'])->name('priority');
            Route::patch('/{record}/approve-void', [\App\Http\Controllers\Admin\DataVerificationController::class, 'approveVoid'])->name('approve-void');
            Route::patch('/{record}/reject-void', [\App\Http\Controllers\Admin\DataVerificationController::class, 'rejectVoid'])->name('reject-void');
        });
    });
});
