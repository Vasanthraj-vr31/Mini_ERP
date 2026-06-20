<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('vendor_id');
            $table->text('vendor_address')->nullable();
            $table->date('order_date');
            $table->date('expected_receipt_date')->nullable();
            $table->unsignedBigInteger('agent_id')->nullable();
            $table->enum('status', ['Draft', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'])
                  ->default('Draft');
            $table->string('source_document')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->foreign('agent_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('purchase_orders');
    }
};
