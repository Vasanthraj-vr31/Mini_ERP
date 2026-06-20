<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BomOperation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bom_id', 'operation_name', 'work_center_id',
        'expected_duration_mins', 'sequence',
    ];

    public function bom()
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function workCenter()
    {
        return $this->belongsTo(WorkCenter::class);
    }
}
