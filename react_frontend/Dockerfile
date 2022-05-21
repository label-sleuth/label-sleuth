FROM node:16
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

# CMD ["npm", "run", "start:dev"]
# ENTRYPOINT ["npm", "run", "start:prod"]
CMD ["npm", "run", "start:prod"]