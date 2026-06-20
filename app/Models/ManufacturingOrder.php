<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManufacturingOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'finished_product_id', 'target_qty', 'uom',
        'bom_id', 'scheduled_date', 'assignee_id',
        'status', 'source_document', 'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'target_qty'     => 'decimal:3',
    ];

    public static $statuses = [
        'Draft', 'Confirmed', 'In-Progress', 'To Close', 'Done', 'Cancelled',
    ];

    public function finishedProduct()
    {
        return $this->belongsTo(Product::class, 'finished_product_id');
    }

    public function bom()
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function components()
    {
        return $this->hasMany(MoComponent::class, 'manufacturing_order_id');
    }

    public function workOrders()
    {
        return $this->hasMany(MoWorkOrder::class, 'manufacturing_order_id')->orderBy('sequence');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable')
                    ->orderByDesc('created_at');
    }

    public function isLate(): bool
    {
        return $this->scheduled_date
            && $this->scheduled_date->isPast()
            && !in_array($this->status, ['Done', 'Cancelled']);
    }
}
