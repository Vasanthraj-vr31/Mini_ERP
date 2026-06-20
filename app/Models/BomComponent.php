<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BomComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'bom_id', 'component_id', 'to_consume_qty', 'uom',
    ];

    protected $casts = [
        'to_consume_qty' => 'decimal:3',
    ];

    public function bom()
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function component()
    {
        return $this->belongsTo(Product::class, 'component_id');
    }
}
