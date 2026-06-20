<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stock_ledger', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->decimal('delta', 12, 3);         // positive = in, negative = out
            $table->decimal('balance_after', 12, 3); // on_hand_qty after movement
            $table->string('reason');
            $table->string('source_document')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->boolean('anomaly_flagged')->default(false);
            $table->text('anomaly_reason')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_ledger');
    }
};
