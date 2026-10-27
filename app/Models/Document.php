<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'title',
        'category',
        'file_path',
        'size',
        'type',
        'date',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
