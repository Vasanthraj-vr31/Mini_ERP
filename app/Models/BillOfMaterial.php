<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillOfMaterial extends Model
{
    use HasFactory;

    protected $table = 'bills_of_materials';

    protected $fillable = [
        'reference', 'finished_product_id', 'base_qty', 'uom', 'notes',
    ];

    protected $casts = [
        'base_qty' => 'decimal:3',
    ];

    public function finishedProduct()
    {
        return $this->belongsTo(Product::class, 'finished_product_id');
    }

    public function components()
    {
        return $this->hasMany(BomComponent::class, 'bom_id');
    }

    public function operations()
    {
        return $this->hasMany(BomOperation::class, 'bom_id')->orderBy('sequence');
    }

    public function manufacturingOrders()
    {
        return $this->hasMany(ManufacturingOrder::class, 'bom_id');
    }
}
