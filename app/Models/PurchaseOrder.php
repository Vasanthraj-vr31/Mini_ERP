<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'vendor_id', 'vendor_address',
        'order_date', 'expected_receipt_date',
        'agent_id', 'status', 'source_document', 'notes',
    ];

    protected $casts = [
        'order_date'           => 'date',
        'expected_receipt_date' => 'date',
    ];

    public static $statuses = [
        'Draft', 'Confirmed', 'Partially Received', 'Received', 'Cancelled',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function lines()
    {
        return $this->hasMany(PurchaseOrderLine::class, 'purchase_order_id');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable')
                    ->orderByDesc('created_at');
    }

    public function getTotalAttribute(): float
    {
        return $this->lines->sum(fn ($l) => $l->ordered_qty * $l->cost_price);
    }

    public function isLate(): bool
    {
        return $this->expected_receipt_date
            && $this->expected_receipt_date->isPast()
            && !in_array($this->status, ['Received', 'Cancelled']);
    }
}
