-- init player data
insert into player (id, name, avatar, status, date) 
          values (1, 'amanda', 'avatar', 0, now());
insert into player (id, name, avatar, status, date) 
          values (2, 'bread', 'avatar', 0, now());
insert into player (id, name, avatar, status, date) 
          values (3, 'calla', 'avatar', 0, now());
insert into player (id, name, avatar, status, date) 
          values (4, 'dan', 'avatar', 0, now());
insert into player (id, name, avatar, status, date) 
          values (5, 'eavan', 'avatar', 0, now());
insert into player (id, name, avatar, status, date) 
          values (6, 'frank', 'avatar', 0, now());

-- init friend_list data
insert into friend_list (id, "user", friend_id) values (100001, 1, 2);
insert into friend_list (id, "user", friend_id) values (100002, 1, 3);
insert into friend_list (id, "user", friend_id) values (100003, 1, 4);
insert into friend_list (id, "user", friend_id) values (100004, 2, 1);
insert into friend_list (id, "user", friend_id) values (100005, 3, 1);
insert into friend_list (id, "user", friend_id) values (100006, 4, 1);

-- init friend_request data
insert into friend_request (id, recv, send) values (100001, 2, 3);
insert into friend_request (id, recv, send) values (100002, 2, 4);

-- init block_list data
insert into block_list (id, "user", target_id) values (100001, 1, 5);
insert into block_list (id, "user", target_id) values (100002, 1, 6);

-- init win_loss_record data
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100001, 1, 10, 3, 7, now());
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100002, 2, 3, 3, 0, now());
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100003, 3, 15, 6, 9, now());
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100004, 4, 7, 4, 3, now());
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100005, 5, 6, 12, -6, now());
insert into win_loss_record (id, user_id, win, loss, score, date) 
                    values (100006, 6, 5, 2, 3, now());

-- init channel_config data
insert into channel_config (id, title, password, public, "limit", date) 
                    values (100001, 'chat1', 1234, true, 10, now());
insert into channel_config (id, title, password, public, "limit", date) 
                    values (100002, 'chat2', 1234, true, 10, now());
insert into channel_config (id, title, password, public, "limit", date) 
                    values (100003, 'chat3', 1234, false, 10, now());
insert into channel_config (id, title, password, public, "limit", date) 
                    values (100004, 'chat4', 1234, false, 2, now());

-- init channel_member data
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100001, 100001, 1, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100002, 100001, 2, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100003, 100001, 3, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100004, 100001, 4, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100005, 100002, 1, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100006, 100002, 2, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100007, 100002, 3, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100008, 100003, 1, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100009, 100003, 2, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100010, 100003, 4, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100011, 100004, 1, true, now());
insert into channel_member (id, channel_id, user_id, op, date) 
                    values (100012, 100004, 3, true, now());

-- init ban_list data
insert into ban_list (id, channel_id, user_id) values (100001, 100001, 5);
insert into ban_list (id, channel_id, user_id) values (100002, 100001, 6);

-- init mute_list data
insert into mute_list (id, channel_id, user_id, date) values (100001, 100001, 4, now());

-- init chat_log data
insert into chat_log (id, channel_id, user_id, content, date) 
              values (100001, 100001, 1, 'hello word!', now());
insert into chat_log (id, channel_id, user_id, content, date) 
              values (100002, 100001, 1, 'good', now());
insert into chat_log (id, channel_id, user_id, content, date) 
              values (100003, 100001, 2, 'im bread', now());
insert into chat_log (id, channel_id, user_id, content, date) 
              values (100004, 100001, 3, 'hello bread', now());

-- init game_history data
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100001, 1, 2, true, 10, 6, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100002, 1, 3, true, 10, 3, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100003, 1, 4, true, 10, 1, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100004, 1, 5, true, 10, 9, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100005, 1, 6, false, 5, 10, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100006, 2, 1, false, 6, 10, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100007, 3, 1, false, 3, 10, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100008, 4, 1, false, 1, 10, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100009, 5, 1, false, 9, 10, now());
insert into game_history (id, "user", opponent_id, result, user_score, opponent_score, date)
                        values (100010, 6, 1, true, 10, 5, now());
