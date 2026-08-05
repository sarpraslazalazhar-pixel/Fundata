<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemCacheRoutesTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(bool $withPermission): Admin
    {
        $permission = Permission::create(['name' => 'akses-konfigurasi', 'guard_name' => 'admin']);
        $role = Role::create(['name' => $withPermission ? 'Pemilik Konfigurasi' : 'Operator', 'guard_name' => 'admin']);
        if ($withPermission) {
            $role->givePermissionTo($permission);
        }
        $admin = Admin::create([
            'username' => 'testadmin',
            'email' => 'testadmin@test.dev',
            'name' => 'Test Admin',
            'password' => 'password',
        ]);
        $admin->assignRole($role);
        return $admin;
    }

    public function test_old_public_get_routes_are_gone(): void
    {
        $this->get('/system/optimize')->assertStatus(404);
        $this->get('/system/clear')->assertStatus(404);
    }

    public function test_unauthenticated_post_redirects_to_admin_login(): void
    {
        $this->post('/admin/system/optimize')->assertRedirect(route('admin.login'));
        $this->post('/admin/system/clear')->assertRedirect(route('admin.login'));
    }

    public function test_admin_without_permission_gets_403(): void
    {
        $admin = $this->makeAdmin(false);
        $this->actingAs($admin, 'admin')->post('/admin/system/optimize')->assertForbidden();
        $this->actingAs($admin, 'admin')->post('/admin/system/clear')->assertForbidden();
    }

    public function test_admin_with_permission_can_optimize_and_clear(): void
    {
        Artisan::shouldReceive('call')->andReturnNull();
        $admin = $this->makeAdmin(true);
        $this->actingAs($admin, 'admin')
            ->post('/admin/system/optimize')
            ->assertSessionHas('success');
        $this->actingAs($admin, 'admin')
            ->post('/admin/system/clear')
            ->assertSessionHas('success');
    }
}
