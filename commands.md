## Build
docker build -t team-retro .

## Run
docker run -d -p 5000:5000 --name team-retro-app team-retro

## Server logs
docker logs team-retro-app
docker logs -f team-retro-app    # Follow logs in real-time

## Container check
docker ps                        # Running containers
docker ps -a                     # All containers (including stopped)

## Stop container 
docker stop team-retro-app

## Start container
docker start team-retro-app     # After stop

## Remove container
docker rm team-retro-app         # Must be stopped first
docker rm -f team-retro-app      # Force remove (even if running)

## Remove image
docker rmi team-retro

## Full cleanup and rebuild:
docker rm -f team-retro-app && docker rmi team-retro && docker build -t team-retro . && docker run -d -p 5000:5000 --name team-retro-app team-retro