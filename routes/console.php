<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('reminder:booking')->dailyAt('07:00');
Schedule::command('reminder:pending')->dailyAt('08:00');
Schedule::command('tickets:auto-solve')->hourly();
