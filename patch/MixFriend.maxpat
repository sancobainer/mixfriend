{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 1,
			"revision" : 11,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 34.0, 77.0, 1068.0, 723.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 230.0, 476.0, 540.0, 22.0 ],
					"text" : "replace \"C:/Users/sande/OneDrive/Desktop/tidal-dj-library/playlists/breakbeat/Aloka - Concave.mp3\""
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 358.0, 326.0, 539.0, 22.0 ],
					"text" : "loadfile \"C:/Users/sande/OneDrive/Desktop/tidal-dj-library/playlists/breakbeat/Aloka - Concave.mp3\""
				}

			}
, 			{
				"box" : 				{
					"fontface" : 1,
					"fontsize" : 18.0,
					"id" : "obj-title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 12.0, 300.0, 27.0 ],
					"text" : "MIXFRIEND v0.1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-sub",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 40.0, 500.0, 20.0 ],
					"text" : "Select folder → Analyze Queue. Analyzes first 30s per track (max 10)."
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 10.0,
					"id" : "obj-sep1",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 65.0, 600.0, 18.0 ],
					"text" : "── Folder & Queue ──────────────────────────────────────────────"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-btn-folder",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 15.0, 84.0, 24.0, 24.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-lbl-folder",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 46.0, 88.0, 110.0, 20.0 ],
					"text" : "Choose Folder"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-opendialog",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"patching_rect" : [ 15.0, 118.0, 90.0, 22.0 ],
					"text" : "opendialog fold"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-pre-scandir",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 15.0, 152.0, 120.0, 22.0 ],
					"text" : "prepend scandir"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-js-clear",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 380.0, 152.0, 150.0, 22.0 ],
					"saved_object_attributes" : 					{
						"filename" : "mixfriend.js",
						"parameter_enable" : 0
					}
,
					"text" : "js mixfriend.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-status-clear",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 445.5, 184.0, 200.0, 22.0 ],
					"text" : "(clear status)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-btn-start",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 230.0, 84.0, 24.0, 24.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-lbl-start",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 261.0, 88.0, 110.0, 20.0 ],
					"text" : "Analyze Queue"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-start",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 230.0, 118.0, 45.0, 22.0 ],
					"text" : "start"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-btn-clear",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 380.0, 84.0, 24.0, 24.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-lbl-clear",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 411.0, 88.0, 100.0, 20.0 ],
					"text" : "Clear Cache"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-clear",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 380.0, 118.0, 45.0, 22.0 ],
					"text" : "clear"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 10.0,
					"id" : "obj-sep2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 272.0, 600.0, 18.0 ],
					"text" : "── JS Engine ───────────────────────────────────────────────────"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-js-queue",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 19.0, 319.0, 150.0, 22.0 ],
					"saved_object_attributes" : 					{
						"filename" : "mixfriend.js",
						"parameter_enable" : 0
					}
,
					"text" : "js mixfriend.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-status-queue",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 84.5, 366.0, 45.0, 36.0 ],
					"text" : "(status)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-pre-settext",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 15.0, 352.0, 120.0, 22.0 ],
					"text" : "prepend settext"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-json-out",
					"linecount" : 4,
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 15.0, 382.0, 55.0, 20.0 ],
					"text" : "(JSON results appear here)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-route-cmd",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 5,
					"outlettype" : [ "", "", "", "", "" ],
					"patching_rect" : [ 150.0, 387.0, 290.0, 22.0 ],
					"text" : "route loadfile result cached done"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-unpack-res",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "float", "" ],
					"patching_rect" : [ 235.0, 422.0, 90.0, 22.0 ],
					"text" : "unpack f s"
				}

			}
, 			{
				"box" : 				{
					"fontface" : 1,
					"id" : "obj-lbl-bpm",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 650.0, 445.0, 50.0, 20.0 ],
					"text" : "BPM"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-bpm-num",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 640.0, 476.0, 70.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontface" : 1,
					"id" : "obj-lbl-key",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 723.0, 445.0, 50.0, 20.0 ],
					"text" : "KEY"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-key-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 717.0, 476.0, 110.0, 22.0 ],
					"text" : "—"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 10.0,
					"id" : "obj-sep3",
					"linecount" : 5,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 25.0, 460.0, 120.0, 64.0 ],
					"text" : "── Audio Analysis Engine ──────────────────────────────────────"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-buf",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "float", "bang" ],
					"patching_rect" : [ 150.0, 502.0, 120.0, 22.0 ],
					"text" : "buffer~ mf_buf"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-pre-replace",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150.0, 449.0, 120.0, 22.0 ],
					"text" : "prepend replace"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-t-after-load",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 150.0, 536.0, 55.0, 22.0 ],
					"text" : "t b b"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-play1",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150.0, 567.0, 24.0, 22.0 ],
					"text" : "1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-delay-fin",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 186.0, 571.0, 95.0, 22.0 ],
					"text" : "delay 30000"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-play",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 150.0, 615.0, 110.0, 22.0 ],
					"text" : "play~ mf_buf"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-bpm-sub",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 35.0, 640.0, 130.0, 22.0 ],
					"text" : "p bpm-analysis",
					"patcher" : 				{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 8,
							"minor" : 1,
							"revision" : 11,
							"architecture" : "x64",
							"modernui" : 1
						}
,
						"classnamespace" : "box",
						"rect" : [ 100.0, 100.0, 400.0, 300.0 ],
						"bglocked" : 0,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 15.0, 15.0 ],
						"gridsnaponopen" : 1,
						"boxes" : [ 						{
								"box" : 								{
									"id" : "obj-bpm-in",
									"maxclass" : "inlet~",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "signal" ],
									"patching_rect" : [ 20.0, 20.0, 30.0, 30.0 ],
									"comment" : "audio in"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-bpm-peakamp",
									"maxclass" : "newobj",
									"numinlets" : 2,
									"numoutlets" : 1,
									"outlettype" : [ "float" ],
									"patching_rect" : [ 20.0, 70.0, 100.0, 22.0 ],
									"text" : "peakamp~ 512"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-bpm-prepend",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 20.0, 120.0, 100.0, 22.0 ],
									"text" : "prepend amp"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-bpm-out",
									"maxclass" : "outlet",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 20.0, 170.0, 30.0, 30.0 ],
									"comment" : "amp message out"
								}

							}
 ],
						"lines" : [ 						{
								"patchline" : 								{
									"destination" : [ "obj-bpm-peakamp", 0 ],
									"source" : [ "obj-bpm-in", 0 ]
								}

							}
, 						{
								"patchline" : 								{
									"destination" : [ "obj-bpm-prepend", 0 ],
									"source" : [ "obj-bpm-peakamp", 0 ]
								}

							}
, 						{
								"patchline" : 								{
									"destination" : [ "obj-bpm-out", 0 ],
									"source" : [ "obj-bpm-prepend", 0 ]
								}

							}
 ]
					}

				}

			}
, 			{
				"box" : 				{
					"id" : "obj-key-sub",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 165.0, 640.0, 130.0, 22.0 ],
					"text" : "p key-analysis",
					"patcher" : 				{
						"fileversion" : 1,
						"appversion" : 						{
							"major" : 8,
							"minor" : 1,
							"revision" : 11,
							"architecture" : "x64",
							"modernui" : 1
						}
,
						"classnamespace" : "box",
						"rect" : [ 100.0, 100.0, 400.0, 300.0 ],
						"bglocked" : 0,
						"openinpresentation" : 0,
						"default_fontsize" : 12.0,
						"default_fontface" : 0,
						"default_fontname" : "Arial",
						"gridonopen" : 1,
						"gridsize" : [ 15.0, 15.0 ],
						"gridsnaponopen" : 1,
						"boxes" : [ 						{
								"box" : 								{
									"id" : "obj-key-in",
									"maxclass" : "inlet~",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "signal" ],
									"patching_rect" : [ 20.0, 20.0, 30.0, 30.0 ],
									"comment" : "audio in"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-key-fzero",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 3,
									"outlettype" : [ "float", "float", "" ],
									"patching_rect" : [ 20.0, 70.0, 60.0, 22.0 ],
									"text" : "fzero~"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-key-prepend",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 20.0, 120.0, 105.0, 22.0 ],
									"text" : "prepend pitch"
								}

							}
, 						{
								"box" : 								{
									"id" : "obj-key-out",
									"maxclass" : "outlet",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 20.0, 170.0, 30.0, 30.0 ],
									"comment" : "pitch message out"
								}

							}
 ],
						"lines" : [ 						{
								"patchline" : 								{
									"destination" : [ "obj-key-prepend", 0 ],
									"source" : [ "obj-key-fzero", 0 ]
								}

							}
, 						{
								"patchline" : 								{
									"destination" : [ "obj-key-out", 0 ],
									"source" : [ "obj-key-prepend", 0 ]
								}

							}
, 						{
								"patchline" : 								{
									"destination" : [ "obj-key-fzero", 0 ],
									"source" : [ "obj-key-in", 0 ]
								}

							}
 ]
					}

				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-stop",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 290.0, 615.0, 24.0, 22.0 ],
					"text" : "0"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-fin",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 331.0, 615.0, 65.0, 22.0 ],
					"text" : "finalize"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-msg-cachepath",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 15.0, 700.0, 500.0, 22.0 ],
					"text" : "cachepath C:/Users/sande/Projects/MixFriend/db/cache.json"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-lbl-cachepath",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 525.0, 703.0, 280.0, 20.0 ],
					"text" : "← bang this once on open (or put in a loadbang)"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-route-cmd", 0 ],
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-buf", 0 ],
					"source" : [ "obj-3", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-msg-clear", 0 ],
					"source" : [ "obj-btn-clear", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-opendialog", 0 ],
					"source" : [ "obj-btn-folder", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-msg-start", 0 ],
					"source" : [ "obj-btn-start", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-t-after-load", 0 ],
					"source" : [ "obj-buf", 1 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 1
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-msg-fin", 0 ],
					"order" : 0,
					"source" : [ "obj-delay-fin", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-msg-stop", 0 ],
					"order" : 1,
					"source" : [ "obj-delay-fin", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-status-clear", 0 ],
					"source" : [ "obj-js-clear", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-pre-settext", 0 ],
					"source" : [ "obj-js-queue", 0 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 6
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-json-out", 0 ],
					"source" : [ "obj-pre-settext", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-route-cmd", 0 ],
					"source" : [ "obj-js-queue", 2 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 7
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-status-queue", 0 ],
					"source" : [ "obj-js-queue", 1 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 8
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-clear", 0 ],
					"midpoints" : [ 24.5, 732.0, 992.0, 732.0, 992.0, 141.0, 389.5, 141.0 ],
					"order" : 0,
					"source" : [ "obj-msg-cachepath", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"midpoints" : [ 24.5, 732.0, 2.5, 732.0, 2.5, 308.0, 28.5, 308.0 ],
					"order" : 1,
					"source" : [ "obj-msg-cachepath", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-clear", 0 ],
					"source" : [ "obj-msg-clear", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"midpoints" : [ 340.5, 640.0, 905.5, 640.0, 905.5, 281.0, 28.5, 281.0 ],
					"source" : [ "obj-msg-fin", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-play", 0 ],
					"source" : [ "obj-msg-play1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"source" : [ "obj-msg-start", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-play", 0 ],
					"source" : [ "obj-msg-stop", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-pre-scandir", 0 ],
					"source" : [ "obj-opendialog", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-bpm-sub", 0 ],
					"order" : 1,
					"source" : [ "obj-play", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-key-sub", 0 ],
					"order" : 0,
					"source" : [ "obj-play", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"midpoints" : [ 44.5, 732.0, 952.5, 732.0, 952.5, 281.0, 28.5, 281.0 ],
					"source" : [ "obj-bpm-sub", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"midpoints" : [ 174.5, 732.0, 922.5, 732.0, 922.5, 281.0, 28.5, 281.0 ],
					"source" : [ "obj-key-sub", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-buf", 0 ],
					"source" : [ "obj-pre-replace", 0 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 2
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js-queue", 0 ],
					"source" : [ "obj-pre-scandir", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-pre-replace", 0 ],
					"source" : [ "obj-route-cmd", 0 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 9
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-unpack-res", 0 ],
					"source" : [ "obj-route-cmd", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-unpack-res", 0 ],
					"source" : [ "obj-route-cmd", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-delay-fin", 0 ],
					"source" : [ "obj-t-after-load", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-msg-play1", 0 ],
					"source" : [ "obj-t-after-load", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-bpm-num", 0 ],
					"source" : [ "obj-unpack-res", 0 ],
					"watchpoint_flags" : 5,
					"watchpoint_id" : 10
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-key-msg", 0 ],
					"source" : [ "obj-unpack-res", 1 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "mixfriend.js",
				"bootpath" : "~/Projects/MixFriend/patch",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
 ],
		"autosave" : 0
	}

}
