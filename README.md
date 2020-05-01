# issue-tracker

## Setup the dev env
### Windows
1. Install [vagrant](https://www.vagrantup.com/docs/installation/) for your OS. Disable the hyper-v from [here](https://ugetfix.com/ask/how-to-disable-hyper-v-in-windows-10/).
2. Install Git Bash (bundled with git) from [here](https://git-scm.com/downloads).
3. Enable VT-x from your BIOS.
4. Run Git Bash as administrator and run
    ```
    git config --global core.symlinks true
    ```
5. Confirm the setting
    ```
    git config core.symlinks
    ```
    If you see true, you can go ahead.
6. Clone this repository anywhere on your PC
    ```bash
    git clone "https://github.com/Zeal-Student-Developers/issue-tracker.git"
    ```
7. Run the following commands
    ```bash
    cd issue-tracker
    vagrant plugin install vagrant-vbguest
    vagrant up
    ```
    First time it will run, it will take some time to download and setup the vm, and then provision it.
8. Once vagrant is up and running, you need to connect to it
    ```bash
    vagrant ssh
    ```
9. Run the following commands to complete the provisioning which was started earlier. This will setup the volumes required for node_modules and mongodb database. Also it will setup the containers for nodejs and mongodb.
    ```
    tools/setup/setup full
    ```

### Linux:

1. Install Docker and Docker Compose.
    ```bash
    sudo apt-get update

    # Install Docker dependencies
    sudo apt-get -y install apt-transport-https ca-certificates curl gnupg-agent software-properties-common

    # Add Docker’s official GPG key:
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

    # Set the stable repo
    sudo add-apt-repository -y \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"

    # Install docker
    sudo apt-get update && sudo apt-get -y install docker-ce docker-ce-cli containerd.io

    # Docker Compose Installation
    sudo curl -s -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Auto start the docker service on boot
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -aG docker $USER
    ```
    **Reboot** your system.

2. Clone this repository anywhere on your PC
    ```bash
    git clone "https://github.com/Zeal-Student-Developers/issue-tracker.git"
    ```
3. Run the following commands to setup the containers. This will setup the volumes required for node_modules and mongodb database. Also it will setup the containers for nodejs and mongodb.
    ```
    cd issue-tracker
    tools/setup/setup
    ```

### Running the Application

Once the setup is completed without errors, you are good to go and test the application. To run the nodemon server,
```
tools/run-dev
```
or if you want the containers to run in the background (detached),
```
tools/run-dev -d
```

Open your web browser and go to `localhost:8080`. If you see `Hello World!` there, then you are good to go! 

To develop the application simply open the repo and start making changes. These changes will be reflected in the server (as long as nodemon is running.)

To stop the containers, if you did `tools/run-dev` without `-d` simply press `CTRL + C`. If you used `-d` switch then simply run `tools/stop-dev`

> **Note** : Do not run npm or node in local machine. Use the vm. To install the dependencies instead of using `npm install module --save`, add your module name in `package.json` and run `tools/install-deps`