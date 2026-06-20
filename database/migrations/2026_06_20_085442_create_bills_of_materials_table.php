<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bills_of_materials', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('finished_product_id');
            $table->decimal('base_qty', 12, 3)->default(1);
            $table->string('uom', 50)->default('pcs');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('finished_product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bills_of_materials');
    }
};
