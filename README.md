# issue-tracker

## Design Docs - [Report](https://docs.google.com/document/d/1bSxKplzKEExaDO_hDHGbS8rYdlYFd403Kzm9HlsdJuc/edit?usp=sharing) | [Discussions](https://docs.google.com/document/d/1JIzv47-MdkER7FllHeEmqFzIFCkucpuBuT2OBrFL0D4/edit) | [MoM](https://docs.google.com/document/d/1kR4PYiB2ZeFXUeXK2MlCa8alAgitnjbMccxorV35W9A/edit)

## Setup the dev env

### Windows

1. Install [vagrant](https://www.vagrantup.com/docs/installation/) for your OS. Disable the hyper-v from [here](https://ugetfix.com/ask/how-to-disable-hyper-v-in-windows-10/).
2. Install latest [VirtuaBox](https://www.virtualbox.org/wiki/Downloads) for your windows system. This is **required**.
3. Install Git Bash (bundled with git) from [here](https://git-scm.com/downloads).
4. Enable VT-x from your BIOS.
5. Run Git Bash as administrator and run
   ```
   git config --global core.symlinks true
   ```
6. Confirm the setting
   ```
   git config core.symlinks
   ```
   If you see `true`, you can go ahead.
7. Clone this repository anywhere on your PC
   ```bash
   git clone "https://github.com/Zeal-Student-Developers/issue-tracker.git"
   ```
8. Run the following commands
   ```bash
   cd issue-tracker
   vagrant plugin install vagrant-vbguest
   vagrant up --provider=virtualbox
   ```
   First time it will run, it will take some time to download and setup the vm, and then provision it.
   > Note: You may get _timed out_ error and will probably need to run this command a several times to get it working. It's an issue with vagrant.
9. Once vagrant is up and running, you need to connect to it
   ```bash
   vagrant ssh
   ```
10. Run the following commands to complete the provisioning which was started earlier. This will setup the volumes required for node_modules and mongodb database. Also it will setup the containers for nodejs and mongodb.
    ```
    tools/setup/setup full
    ```

### Linux:

1. Install Docker and Docker Compose. You may need to enter your password while executing.

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

   # Make your scripts executable
   cd YOUR_ISSUE_TRACKER_DIR
   sudo chmod +x tools/* tools/setup/*
   ```

   **Reboot** your system.

2. Clone this repository anywhere on your PC
   ```bash
   git clone "https://github.com/Zeal-Student-Developers/issue-tracker.git"
   ```
3. Run the following commands to setup the containers. This will setup the volumes required for node_modules and mongodb database. Also it will setup the containers for nodejs and mongodb.
   ```
   cd issue-tracker
   tools/setup/setup full
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

Open your web browser and go to `localhost:3000`. If you see `Hello World!` there, then you are good to go!

To develop the application simply open the repo and start making changes. These changes will be reflected in the server (as long as nodemon is running.)

To stop the containers, if you did `tools/run-dev` without `-d` simply press `CTRL + C`. If you used `-d` switch then simply run `tools/stop-dev`

> **Note** : Do not run npm or node in local machine. Use the vm. To install the dependencies instead of using `npm install module --save`, add your module name in `package.json` and run `tools/install-deps`

## Shutdown and Restart the Dev Env

### Windows

Whenever you want to stop working you need to `halt` the vagrant vm. This will free all the resources that vagrant was using.

```
vagrant halt
```

When you want to start the dev env again, you need to `up` the vagrant vm.

```
vagrant up
```

When you feel, that you need to restart the vm, you have to `reload` the vagrant vm.

```
vagrant reload
```

If you want to clear everything and delete the vagrant vm,

```
vagrant destroy
```

After using vagrant `reload` and `up` you need to get into the vm using

```
vagrant ssh
```

and then of course you need to use the `tools/run-dev` and `tools/stop-dev` to start and stop the docker containers inside the vm as well.

### Linux

Nothing special is required and using just the `tools/stop-dev` and `tools/run-dev` are enough for starting and stopping the dev environment in Linux.

## Known Issue

- If you find _timed out_ errors on Windows, you just need to retry `vagrant up` multiple times to get it working. It's an issue with vagrant.

- If you find the error line

```
The vagrant user is unable to write to Project directory
```

while running the vagrant up command, then you probably have some write issues. We can solve this by doing the following. You need to `cd` into your `issue-tracker` directory. After that run the following :-

```
vagrant halt -f
rm -rf .vagrant
sudo chown -R 1000:$(id -g) .
vagrant up
```

Remove `sudo` if you are on _Windows_.
And hopefully the error is gone and you can resume your work.

## Running Tests

Having isolated environments with vagrant and docker, we can easily setup unit
and integration tests. We can provide the containers with a separate `.env` file
for each test. As unit tests don't need database dependency, we don't have the
`database` service in `docker-compose` running alongside it.

Make sure you first update and install the dependencies by running,

```
tools/install-deps
```

To run the tests,

```
tools/run-test unit         # For unit tests

tools/run-test integration  # For integration tests

tools/run-test coverage     # For code coverage reports
```
