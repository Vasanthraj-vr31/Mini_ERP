<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MoWorkOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'manufacturing_order_id', 'operation_name', 'work_center_id',
        'expected_duration_mins', 'real_duration_mins', 'status', 'sequence',
    ];

    public function manufacturingOrder()
    {
        return $this->belongsTo(ManufacturingOrder::class);
    }

    public function workCenter()
    {
        return $this->belongsTo(WorkCenter::class);
    }
}
