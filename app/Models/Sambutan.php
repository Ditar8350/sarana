<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sambutan extends Model
{
    protected $fillable = [
        'photo',
        'judul_kepala_biro',
        'name',
        'title',
        'message',
    ];
}
