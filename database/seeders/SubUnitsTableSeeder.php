<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SubUnitsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('sub_units')->delete();
        
        \DB::table('sub_units')->insert(array (
            0 => 
            array (
                'id' => 18,
                'unit_id' => 7,
                'nama_layanan' => 'Input data transaksi',
                'deskripsi' => NULL,
                'aktif' => 1,
                'is_revision_enabled' => 0,
                'created_at' => '2026-07-29 10:18:30',
                'updated_at' => '2026-07-29 10:31:34',
            ),
            1 => 
            array (
                'id' => 19,
                'unit_id' => 7,
                'nama_layanan' => 'Permintaan Void',
                'deskripsi' => NULL,
                'aktif' => 1,
                'is_revision_enabled' => 0,
                'created_at' => '2026-07-29 10:18:46',
                'updated_at' => '2026-07-29 10:18:46',
            ),
            2 => 
            array (
                'id' => 20,
                'unit_id' => 8,
                'nama_layanan' => 'Tambah data donatur',
                'deskripsi' => NULL,
                'aktif' => 1,
                'is_revision_enabled' => 0,
                'created_at' => '2026-07-29 10:19:15',
                'updated_at' => '2026-07-29 10:19:15',
            ),
            3 => 
            array (
                'id' => 21,
                'unit_id' => 8,
                'nama_layanan' => 'Edit data donatur',
                'deskripsi' => NULL,
                'aktif' => 1,
                'is_revision_enabled' => 0,
                'created_at' => '2026-07-29 10:19:38',
                'updated_at' => '2026-07-29 10:19:38',
            ),
        ));
        
        
    }
}