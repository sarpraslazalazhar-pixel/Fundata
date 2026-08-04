<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FormFieldsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('form_fields')->delete();
        
        \DB::table('form_fields')->insert(array (
            0 => 
            array (
                'id' => 95,
                'sub_unit_id' => 18,
                'label' => 'Nama Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 1,
                'created_at' => '2026-07-29 10:20:33',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            1 => 
            array (
                'id' => 96,
                'sub_unit_id' => 18,
                'label' => 'Akat',
                'tipe_field' => 'dropdown',
                'wajib' => 1,
                'opsi' => '["Zakat","Infak","Infak khusus","DSKL"]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 5,
                'created_at' => '2026-07-29 10:21:44',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            2 => 
            array (
                'id' => 97,
                'sub_unit_id' => 18,
                'label' => 'Waktu',
                'tipe_field' => 'waktu',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 4,
                'created_at' => '2026-07-29 10:22:15',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            3 => 
            array (
                'id' => 98,
                'sub_unit_id' => 18,
                'label' => 'Tanggal',
                'tipe_field' => 'tanggal',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 3,
                'created_at' => '2026-07-29 10:22:29',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            4 => 
            array (
                'id' => 99,
                'sub_unit_id' => 18,
                'label' => 'Nama Program',
                'tipe_field' => 'teks_pendek',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 6,
                'created_at' => '2026-07-29 10:22:46',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            5 => 
            array (
                'id' => 100,
                'sub_unit_id' => 18,
                'label' => 'Metode Pembayaran',
                'tipe_field' => 'dropdown',
                'wajib' => 1,
                'opsi' => '["CIMB Infak","BCA Zakat"]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 7,
                'created_at' => '2026-07-29 10:23:35',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            6 => 
            array (
                'id' => 101,
                'sub_unit_id' => 18,
                'label' => 'Deskripsi Tambahan',
                'tipe_field' => 'teks_panjang',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 8,
                'created_at' => '2026-07-29 10:24:00',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            7 => 
            array (
                'id' => 102,
                'sub_unit_id' => 19,
                'label' => 'NO KWITANSI',
                'tipe_field' => 'teks_panjang',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 1,
                'created_at' => '2026-07-29 10:25:57',
                'updated_at' => '2026-07-29 10:25:57',
            ),
            8 => 
            array (
                'id' => 103,
                'sub_unit_id' => 19,
                'label' => 'Nama Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 2,
                'created_at' => '2026-07-29 10:26:10',
                'updated_at' => '2026-07-29 10:26:10',
            ),
            9 => 
            array (
                'id' => 104,
                'sub_unit_id' => 19,
                'label' => 'Tanggal Transaksi',
                'tipe_field' => 'tanggal',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 3,
                'created_at' => '2026-07-29 10:26:31',
                'updated_at' => '2026-07-29 10:26:31',
            ),
            10 => 
            array (
                'id' => 105,
                'sub_unit_id' => 19,
                'label' => 'Nominal',
                'tipe_field' => 'nominal_rp',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 4,
                'created_at' => '2026-07-29 10:26:45',
                'updated_at' => '2026-07-29 13:32:53',
            ),
            11 => 
            array (
                'id' => 106,
                'sub_unit_id' => 19,
                'label' => 'Keterangan Tambahan',
                'tipe_field' => 'teks_panjang',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 5,
                'created_at' => '2026-07-29 10:27:00',
                'updated_at' => '2026-07-29 10:27:00',
            ),
            12 => 
            array (
                'id' => 107,
                'sub_unit_id' => 20,
                'label' => 'Nama Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 2,
                'created_at' => '2026-07-29 10:27:33',
                'updated_at' => '2026-07-29 10:40:29',
            ),
            13 => 
            array (
                'id' => 108,
                'sub_unit_id' => 18,
                'label' => 'Lampiran',
                'tipe_field' => 'upload_gambar',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 9,
                'created_at' => '2026-07-29 10:30:19',
                'updated_at' => '2026-07-30 11:19:15',
            ),
            14 => 
            array (
                'id' => 109,
                'sub_unit_id' => 19,
                'label' => 'Lampiran',
                'tipe_field' => 'upload_gambar',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 6,
                'created_at' => '2026-07-29 10:30:50',
                'updated_at' => '2026-07-29 10:30:50',
            ),
            15 => 
            array (
                'id' => 110,
                'sub_unit_id' => 20,
                'label' => 'Tipe Donatur',
                'tipe_field' => 'dropdown',
                'wajib' => 1,
                'opsi' => '["Perorang-an","Badan\\/Lembaga"]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 1,
                'created_at' => '2026-07-29 10:35:27',
                'updated_at' => '2026-07-29 10:40:29',
            ),
            16 => 
            array (
                'id' => 111,
                'sub_unit_id' => 20,
                'label' => 'Jenis Kelamin',
                'tipe_field' => 'dropdown',
                'wajib' => 1,
                'opsi' => '["Laki-laki","Perempuan"]',
                'parent_field_id' => 110,
                'trigger_value' => 'Perorang-an',
                'urutan' => 3,
                'created_at' => '2026-07-29 10:36:40',
                'updated_at' => '2026-07-29 10:36:40',
            ),
            17 => 
            array (
                'id' => 112,
                'sub_unit_id' => 20,
                'label' => 'Nomer Handphone',
                'tipe_field' => 'angka',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 4,
                'created_at' => '2026-07-29 10:37:49',
                'updated_at' => '2026-07-29 10:40:29',
            ),
            18 => 
            array (
                'id' => 113,
                'sub_unit_id' => 20,
                'label' => 'Email',
                'tipe_field' => 'teks_pendek',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 5,
                'created_at' => '2026-07-29 10:37:56',
                'updated_at' => '2026-07-29 10:40:29',
            ),
            19 => 
            array (
                'id' => 114,
                'sub_unit_id' => 20,
                'label' => 'Deskripsi Tambahan',
                'tipe_field' => 'teks_pendek',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 6,
                'created_at' => '2026-07-29 10:38:16',
                'updated_at' => '2026-07-29 10:40:29',
            ),
            20 => 
            array (
                'id' => 115,
                'sub_unit_id' => 21,
                'label' => 'Nama Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 1,
                'created_at' => '2026-07-29 10:39:46',
                'updated_at' => '2026-07-29 10:41:02',
            ),
            21 => 
            array (
                'id' => 116,
                'sub_unit_id' => 21,
                'label' => 'Nomer telepon',
                'tipe_field' => 'angka',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 3,
                'created_at' => '2026-07-29 10:40:05',
                'updated_at' => '2026-07-29 10:41:02',
            ),
            22 => 
            array (
                'id' => 117,
                'sub_unit_id' => 20,
                'label' => 'Alamat Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 3,
                'created_at' => '2026-07-29 10:40:23',
                'updated_at' => '2026-07-29 10:40:40',
            ),
            23 => 
            array (
                'id' => 118,
                'sub_unit_id' => 21,
                'label' => 'Alamat Donatur',
                'tipe_field' => 'teks_pendek',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 2,
                'created_at' => '2026-07-29 10:41:00',
                'updated_at' => '2026-07-29 10:41:02',
            ),
            24 => 
            array (
                'id' => 119,
                'sub_unit_id' => 21,
                'label' => 'Email',
                'tipe_field' => 'teks_pendek',
                'wajib' => 0,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 4,
                'created_at' => '2026-07-29 10:41:36',
                'updated_at' => '2026-07-29 10:41:36',
            ),
            25 => 
            array (
                'id' => 120,
                'sub_unit_id' => 18,
                'label' => 'Jumlah Donasi',
                'tipe_field' => 'nominal_rp',
                'wajib' => 1,
                'opsi' => '[]',
                'parent_field_id' => NULL,
                'trigger_value' => NULL,
                'urutan' => 2,
                'created_at' => '2026-07-29 11:02:04',
                'updated_at' => '2026-07-30 11:19:15',
            ),
        ));
        
        
    }
}