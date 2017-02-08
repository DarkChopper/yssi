import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';

import { Stores } from '../../../../both/collections/stores.collection';
import { Store } from '../../../../both/models/store.model';
import { Users } from '../../../../both/collections/users.collection';
import { User } from '../../../../both/models/user.model';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { MouseEvent } from "angular2-google-maps/core";


import { Comments } from '../../../../both/collections/comments.collection';
import { Comment } from '../../../../both/models/comment.model';



import { AppComponentService } from '../app.component.service';

import 'rxjs/add/operator/map';

import template from './store-details.component.html';
import style from './store-details.component.scss';

@Component({
  selector: 'store-details',
  template,
  styles: [style]
})
@InjectUser('user')
export class StoreDetailsComponent implements OnInit, OnDestroy {
  stores: Store[] = [];
  storeId: string;
  ownerId: string;
  paramsSub: Subscription;
  store: Store;
  storeSub: Subscription;
  owner: User;
  ownerSub: Subscription;
  comment: Comment;
  comments: Comment[] = [];
  commentSub: Subscription;
  user: Meteor.User;
  centerLat: number = 37.4292;
  centerLng: number = -122.1381;
  imagesSubs: Subscription;
  addCommentForm: FormGroup;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: AppComponentService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {

    this.addCommentForm = this.formBuilder.group({
      main: ['', Validators.required],
      note: ['', Validators.required],
    });
    this.imagesSubs = MeteorObservable.subscribe('images').subscribe();
    this.paramsSub = this.route.params
      .map(params => params['storeId'])
      .subscribe(storeId => {
        this.storeId = storeId;

        if (this.storeSub) {
          this.storeSub.unsubscribe();
        }
        if (this.ownerSub) {
          this.ownerSub.unsubscribe();
        }

        this.storeSub = MeteorObservable.subscribe('store', this.storeId).subscribe(() => {

          this.store = Stores.findOne(this.storeId);
          this.ownerId = this.store.owner;
          this.stores.push(this.store);

          this.ownerSub = MeteorObservable.subscribe('owner', this.storeId).subscribe(() => {
            this.owner = Users.findOne(this.ownerId);
            this.componentService.updateOwner(this.ownerId);
          });

          this.commentSub = MeteorObservable.subscribe('comments', this.storeId).subscribe(() => {

            Comments.find({ store: this.storeId }).subscribe((data) => {
              this.comments = data;
            });
          });

          this.componentService.onEditForm.subscribe(data => {
            this.router.navigate(['/update', this.store._id]);
          });
        });

      });
  }

  saveStore() {
    Stores.update(this.store._id, {
      $set: {
        name: this.store.name,
        description: this.store.description,
        location: this.store.location
      }
    });
  }

  postComment() {
    console.log(this.addCommentForm.value);

    if (this.addCommentForm.value.main === undefined
      || this.addCommentForm.value.main == null
      || this.addCommentForm.value.main.length == 0) {
      return;
    }
    Comments.insert({
      store: this.store._id,
      main: this.addCommentForm.value.main,
      user: Meteor.userId()
    });

  }

  isLoggedIn() {
    if (!Meteor.userId()) {
      return false;
    }
    return true;
  }
  get isOwner(): boolean {
    return this.store && this.user && this.user._id === this.store.owner;
  }
  get lat(): number {
    return this.store && this.store.location.lat;
  }

  get lng(): number {
    return this.store && this.store.location.lng;
  }

  mapClicked($event: MouseEvent) {
    this.store.location.lat = $event.coords.lat;
    this.store.location.lng = $event.coords.lng;
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
    this.storeSub.unsubscribe();
    this.storeSub.unsubscribe();
    this.imagesSubs.unsubscribe();
  }
}
