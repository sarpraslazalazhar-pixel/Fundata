<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\User;
use App\Models\Admin;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user('web'),
                'admin' => $request->user('admin'),
                'is_superadmin' => $request->user('admin') ? $request->user('admin')->hasRole('Super Admin') : false,
                'permissions' => $request->user('admin')
                    ? ($request->user('admin')->hasRole('Super Admin')
                        ? \Spatie\Permission\Models\Permission::pluck('name')
                        : $request->user('admin')->getAllPermissions()->pluck('name'))
                    : [],
                'unread_messages_count' => function () use ($request) {
                    $isAdminPath = $request->is('admin/*') || $request->is('admin');
                    $user = $isAdminPath
                        ? ($request->user('admin') ?: $request->user('web'))
                        : ($request->user('web') ?: $request->user('admin'));

                    if (!$user) return 0;

                    $type = get_class($user);
                    $id = $user->id;

                    return \App\Models\Message::where('is_read', false)
                        ->where(function ($q) use ($id, $type) {
                            $q->where('sender_type', '!=', $type)
                              ->orWhere('sender_id', '!=', $id);
                        })
                        ->whereHas('conversation', function ($q) use ($id, $type) {
                            $q->where(function ($sq) use ($id, $type) {
                                $sq->where('participant_one_type', $type)
                                   ->where('participant_one_id', $id);
                            })->orWhere(function ($sq) use ($id, $type) {
                                $sq->where('participant_two_type', $type)
                                   ->where('participant_two_id', $id);
                            });
                        })
                        ->count();
                },
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'appConfig' => fn () => [
                'nama_sistem' => \App\Models\SystemConfig::getValue('nama_sistem', 'Halo APU'),
                'logo_path' => \App\Models\SystemConfig::getValue('logo_path'),
                'banner_path' => \App\Models\SystemConfig::getValue('banner_path'),
                'favicon_path' => \App\Models\SystemConfig::getValue('favicon_path'),
                'notification_sound_path' => \App\Models\SystemConfig::getValue('notification_sound_path'),
            ],
        ]);
    }
}
