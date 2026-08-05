<?php

namespace App\Imports;

use App\Models\Donatur;
use Maatwebsite\Excel\Concerns\ToModel;

class DonaturImport implements ToModel
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        return new Donatur([
            //
        ]);
    }
}
