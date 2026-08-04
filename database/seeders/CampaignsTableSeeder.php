<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CampaignsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('campaigns')->delete();
        
        \DB::table('campaigns')->insert(array (
            0 => 
            array (
                'id' => 1,
                'nama_campaign' => 'Test',
                'deskripsi' => 'Hanya Uji Coba',
                'banner_path' => 'campaigns/6a6ac65f84f75_1785382495.png',
                'target_dana' => '1000000.00',
                'is_active' => 1,
                'tgl_mulai' => '2026-06-29',
                'tgl_selesai' => '2026-07-29',
                'created_at' => '2026-07-30 10:06:03',
                'updated_at' => '2026-07-30 10:34:55',
            ),
        ));
        
        
    }
}