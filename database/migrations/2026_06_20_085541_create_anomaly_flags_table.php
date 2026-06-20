<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('anomaly_flags', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('stock_ledger_id')->nullable();
            $table->decimal('delta', 12, 3);
            $table->decimal('mean_delta', 12, 3);
            $table->decimal('std_dev', 12, 3);
            $table->decimal('z_score', 8, 4);
            $table->string('reason');
            $table->boolean('is_reviewed')->default(false);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products');
            $table->foreign('stock_ledger_id')->references('id')->on('stock_ledger')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('anomaly_flags');
    }
};
