<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sale_order_lines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_order_id');
            $table->unsignedBigInteger('product_id');
            $table->string('uom', 50)->default('pcs');
            $table->decimal('ordered_qty', 12, 3);
            $table->decimal('delivered_qty', 12, 3)->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->timestamps();

            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('sale_order_lines');
    }
};
