<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    protected $table = 'news';

    protected $fillable = [
        'title',
        'slug',
        'author',
        'date',
        'image',
        'description',
        'status',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
