<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_order_id');
            $table->unsignedBigInteger('product_id');
            $table->string('uom', 50)->default('pcs');
            $table->decimal('ordered_qty', 12, 3);
            $table->decimal('received_qty', 12, 3)->default(0);
            $table->decimal('cost_price', 12, 2);
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('purchase_order_lines');
    }
};
