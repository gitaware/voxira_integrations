<?php

$manifest = array(
    'acceptable_sugar_versions' => array('regex_matches' => array('^6\\.5\\.')),
    'acceptable_sugar_flavors' => array('CE'),
    'author' => 'Voxira',
    'description' => 'Queue Voxira calls from SuiteCRM record changes.',
    'is_uninstallable' => true,
    'name' => 'Voxira for SuiteCRM',
    'published_date' => '2026-09-25',
    'type' => 'module',
    'version' => '1.0.0',
);

$installdefs = array(
    'id' => 'voxira_suitecrm',
    'copy' => array(
        array('from' => '<basepath>/custom/modules/Voxira', 'to' => 'custom/modules/Voxira'),
        array('from' => '<basepath>/custom/voxira_config.php.example', 'to' => 'custom/voxira_config.php.example'),
        array('from' => '<basepath>/custom/Extension/modules/Cases/Ext/LogicHooks/voxira.php', 'to' => 'custom/Extension/modules/Cases/Ext/LogicHooks/voxira.php'),
        array('from' => '<basepath>/custom/Extension/modules/Leads/Ext/LogicHooks/voxira.php', 'to' => 'custom/Extension/modules/Leads/Ext/LogicHooks/voxira.php'),
    ),
);
