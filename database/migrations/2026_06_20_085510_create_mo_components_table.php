<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mo_components', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('manufacturing_order_id');
            $table->unsignedBigInteger('product_id');
            $table->string('uom', 50)->default('pcs');
            $table->decimal('to_consume_qty', 12, 3);
            $table->decimal('consumed_qty', 12, 3)->default(0);
            $table->timestamps();

            $table->foreign('manufacturing_order_id')->references('id')->on('manufacturing_orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('mo_components');
    }
};
