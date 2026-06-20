<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('customer_id');
            $table->text('shipping_address')->nullable();
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->enum('status', ['Draft', 'Confirmed', 'Partially Delivered', 'Delivered', 'Cancelled'])
                  ->default('Draft');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
            $table->foreign('sales_person_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('sales_orders');
    }
};
