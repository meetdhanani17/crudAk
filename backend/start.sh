sudo npm install
cp env-example.txt .env
cp nginx-dev.text /etc/nginx/conf.d/api-event-service.conf

service nginx restart
pm2 delete api-event-service-2001
pm2 start index.js --name="api-event-service-2001"