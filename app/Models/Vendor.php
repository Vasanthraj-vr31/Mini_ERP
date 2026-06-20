<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'mobile', 'address', 'city', 'gst_number', 'on_time_delivery_rate',
    ];

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function vendorScores()
    {
        return $this->hasMany(VendorScore::class);
    }
}
