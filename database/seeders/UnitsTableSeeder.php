<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UnitsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('units')->delete();
        
        \DB::table('units')->insert(array (
            0 => 
            array (
                'id' => 7,
                'nama_unit' => 'Transaksi',
                'icon' => 'FileText',
                'deskripsi' => NULL,
                'aktif' => 1,
                'created_at' => '2026-07-29 10:14:52',
                'updated_at' => '2026-07-29 10:14:52',
            ),
            1 => 
            array (
                'id' => 8,
                'nama_unit' => 'Data Donatur',
                'icon' => 'FileText',
                'deskripsi' => NULL,
                'aktif' => 1,
                'created_at' => '2026-07-29 10:15:15',
                'updated_at' => '2026-07-29 10:15:15',
            ),
            2 => 
            array (
                'id' => 9,
                'nama_unit' => 'Akun Campaign',
                'icon' => 'Mail',
                'deskripsi' => NULL,
                'aktif' => 1,
                'created_at' => '2026-07-29 10:15:35',
                'updated_at' => '2026-07-29 10:15:35',
            ),
        ));
        
        
    }
}