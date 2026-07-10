#!/bin/bash
# ==============================================================================
# AWS EC2 Deployment Script for Coimbatore School of Digital and Growth
# Designed for Ubuntu 22.04 LTS / 24.04 LTS
# ==============================================================================

# Exit on any error
set -e

echo "=== 🚀 Starting AWS EC2 Setup and Deployment ==="

# 1. Update system packages
echo "Updating system package index..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 3. Install Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose installed successfully."
else
    echo "✅ Docker Compose is already installed."
fi

# 4. Setup Application Directory
APP_DIR="/opt/coimbatore-school-of-digital-and-growth"
echo "Setting up application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Note: You will need to copy your project files or clone your git repository into $APP_DIR.
# If copying files manually via SFTP/SCP or Git:
# cd $APP_DIR

echo "=== ⚙️ Configuring Environment Variables ==="
# Create .env file template if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    cat <<EOT > "$APP_DIR/.env"
# Environment variables for AWS EC2 Deployment
NODE_ENV=production
PORT=3000

# Add your Gemini API Key below
GEMINI_API_KEY=your_gemini_api_key_here

# Replace with your EC2 Public DNS or custom domain (e.g., http://54.210.xx.xx)
APP_URL=http://your_ec2_public_ip
EOT
    echo "✅ Created template .env file at $APP_DIR/.env"
    echo "⚠️  Please edit $APP_DIR/.env to fill in your real GEMINI_API_KEY and APP_URL before running Docker Compose."
else
    echo "✅ Existing .env file found. Preserving it."
fi

echo ""
echo "=== 🎉 Setup Complete! ==="
echo "To finish deployment:"
echo "1. Clone or copy your code repository to: $APP_DIR"
echo "2. Edit the env file to set your actual secrets:"
echo "   nano $APP_DIR/.env"
echo "3. Run the following command inside $APP_DIR to start the app in the background:"
echo "   sudo docker compose up -d --build"
echo ""
echo "4. IMPORTANT: Ensure your AWS EC2 Security Group allows INBOUND traffic on:"
echo "   - TCP Port 80 (HTTP) -> For web access"
echo "   - TCP Port 22 (SSH)  -> For managing the server"
echo "=============================================================================="
