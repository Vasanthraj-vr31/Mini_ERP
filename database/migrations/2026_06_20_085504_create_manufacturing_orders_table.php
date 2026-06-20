<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('manufacturing_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('finished_product_id');
            $table->decimal('target_qty', 12, 3);
            $table->string('uom', 50)->default('pcs');
            $table->unsignedBigInteger('bom_id')->nullable();
            $table->date('scheduled_date');
            $table->unsignedBigInteger('assignee_id')->nullable();
            $table->enum('status', ['Draft', 'Confirmed', 'In-Progress', 'To Close', 'Done', 'Cancelled'])
                  ->default('Draft');
            $table->string('source_document')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('finished_product_id')->references('id')->on('products');
            $table->foreign('bom_id')->references('id')->on('bills_of_materials')->nullOnDelete();
            $table->foreign('assignee_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('manufacturing_orders');
    }
};
