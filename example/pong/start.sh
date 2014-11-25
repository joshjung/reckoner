#!/bin/bash
echo '--------------Killing processes in pid-------------'
./kill.sh
echo '-------------------Server NoHupping-----------------'
if [ -z "$1" ]; then
	ENV="development"
else
	ENV="$1"
fi
cd game-server
CMD="pomelo start -e $ENV"
echo "$CMD"
nohup sh -c "$CMD" > ../shared/log/game-server.log &
cd ../web-server
nohup sh -c "$CMD" > ../shared/log/web-server.log &
echo '-----------------------Waiting----------------------'
sleep 5
echo '-----------------------Catting-----------------------'
cd ..
cat shared/log/game-server.log
cat shared/log/web-server.log