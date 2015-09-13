#!/bin/bash
if [ -z "$1" ]
  then
    echo "No arguments supplied"
    exit 1
fi

[ -z "C:\\Program Files\\Blender Foundation\\Blender\\" ] && echo "Need to set BLENDERPATH" && exit 1;

"C:\Program Files\Blender Foundation\blender/blender" $1 --background --python tools/export-xml3d.py -- sponza1/index.html
