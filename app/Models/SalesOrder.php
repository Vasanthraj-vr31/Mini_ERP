<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'customer_id', 'shipping_address',
        'order_date', 'expected_delivery_date',
        'sales_person_id', 'status', 'notes',
    ];

    protected $casts = [
        'order_date'             => 'date',
        'expected_delivery_date' => 'date',
    ];

    public static $statuses = [
        'Draft', 'Confirmed', 'Partially Delivered', 'Delivered', 'Cancelled',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesPerson()
    {
        return $this->belongsTo(User::class, 'sales_person_id');
    }

    public function lines()
    {
        return $this->hasMany(SaleOrderLine::class, 'sales_order_id');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable')
                    ->orderByDesc('created_at');
    }

    public function getTotalAttribute(): float
    {
        return $this->lines->sum(fn ($l) => $l->ordered_qty * $l->unit_price);
    }

    public function isLate(): bool
    {
        return $this->expected_delivery_date
            && $this->expected_delivery_date->isPast()
            && !in_array($this->status, ['Delivered', 'Cancelled']);
    }
}
