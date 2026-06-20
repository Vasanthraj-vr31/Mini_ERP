<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vendor_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('product_id');
            $table->decimal('normalized_price_rank', 5, 4)->default(0.5);
            $table->decimal('on_time_delivery_rate', 5, 2)->default(100.00);
            $table->decimal('score', 5, 4)->default(0.5); // 0.5*price + 0.5*delivery
            $table->timestamp('computed_at')->useCurrent();
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->unique(['vendor_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('vendor_scores');
    }
};
