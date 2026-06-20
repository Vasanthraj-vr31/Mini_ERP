<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ai_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->enum('alert_type', ['stockout_risk', 'reorder_trigger', 'demand_spike', 'anomaly'])
                  ->default('reorder_trigger');
            $table->string('message');
            $table->text('reason');
            $table->decimal('suggested_qty', 12, 3)->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ai_alerts');
    }
};
