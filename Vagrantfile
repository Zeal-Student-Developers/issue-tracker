Vagrant.configure(2) do |config|

    host_port = 8080
    host_ip_addr = "127.0.0.1"

    vm_num_cpus = "2"
    vm_memory = "2048"

    config.vm.synced_folder ".", "/vagrant", disabled: true
    config.vm.synced_folder ".", "/srv/issue-tracker"

    config.vm.network "forwarded_port", guest: 3000, host: host_port, host_ip: host_ip_addr
    config.vm.network "forwarded_port", guest: 27017, host: 27017, host_ip: host_ip_addr

    config.vm.provider "virtualbox" do |vb, override|
        override.vm.box = "ubuntu/bionic64"

        vb.customize [ "modifyvm", :id, "--uartmode1", "disconnected" ]

        vb.memory = vm_memory
        vb.cpus = vm_num_cpus
    end

$provision_script = <<SCRIPT
set -x
set -e
set -o pipefail

if [ -d "/sys/fs/selinux" ]; then
    sudo mount -o remount,ro /sys/fs/selinux
fi

if ! grep -q 'LC_ALL=en_US.UTF-8' /etc/default/locale; then
    echo "LC_ALL=en_US.UTF-8" | sudo tee -a /etc/default/locale
fi

if [ ! -w /srv/issue-tracker ]; then
    echo "The vagrant user is unable to write to Project directory"
fi

# Update the MOTD for users
sudo cp /srv/issue-tracker/tools/setup/dev-motd /etc/update-motd.d/99-issue-tracker-dev
sudo rm -f /etc/update-motd.d/10-help-text
sudo dpkg --purge landscape-client landscape-common ubuntu-release-upgrader-core update-manager-core update-notifier-common ubuntu-server
sudo dpkg-divert --add --rename /etc/default/motd-news
sudo sh -c 'echo ENABLED=0 > /etc/default/motd-news'

# Create links for the main application source code
ln -nsf /srv/issue-tracker ~/issue-tracker

# Run the provisioning script
/srv/issue-tracker/tools/setup/provision

set +x

SCRIPT

    config.vm.provision "shell",
    privileged: false,
    inline: $provision_script

end