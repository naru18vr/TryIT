CREATE TABLE `videoNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(32) NOT NULL,
	`summary` text NOT NULL,
	`keyPoints` text NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoNotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `videoNotes_videoId_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
CREATE TABLE `watchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` varchar(32) NOT NULL,
	`watchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchHistory_id` PRIMARY KEY(`id`),
	CONSTRAINT `watchHistory_user_video_unique` UNIQUE(`userId`,`videoId`)
);
--> statement-breakpoint
ALTER TABLE `videoNotes` ADD CONSTRAINT `videoNotes_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchHistory` ADD CONSTRAINT `watchHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;