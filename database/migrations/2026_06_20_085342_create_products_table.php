<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('uom', 50)->default('pcs');
            $table->decimal('sales_price', 12, 2)->default(0);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('on_hand_qty', 12, 3)->default(0);
            $table->decimal('reserved_qty', 12, 3)->default(0);
            $table->boolean('procure_on_demand')->default(false);
            $table->enum('replenishment_route', ['Vendor', 'BoM'])->default('Vendor');
            $table->unsignedBigInteger('preferred_vendor_id')->nullable();
            $table->decimal('reorder_point', 12, 3)->default(0);
            $table->decimal('safety_stock', 12, 3)->default(0);
            $table->integer('lead_time_days')->default(7);
            $table->string('category')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};
