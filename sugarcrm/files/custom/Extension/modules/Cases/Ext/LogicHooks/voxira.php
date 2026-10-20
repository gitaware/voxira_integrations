<?php

$hook_array['after_save'][] = array(
    90,
    'Queue a Voxira notification',
    'custom/modules/Voxira/VoxiraLogicHook.php',
    'VoxiraLogicHook',
    'afterSave',
);
