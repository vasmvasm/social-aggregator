var app = angular.module('content', []);
app.controller('MapUsersCtrl',function($scope,$http){

    $scope.addUser = function(){
        $http({
            method: 'POST',
            url: '/saveUsers',
            data:{
                app:$scope.selectedApp,
                name:$scope.name,
                twitter_handle:$scope.twitter_handle,
                insta_handle:$scope.insta_handle,
                profile_pic:$scope.profile_pic,
                category:$scope.selectedCategory,
                oldCategory:$scope.selected,
                edit:($scope.edit==undefined)?false:$scope.edit
            }
        }).success(function(){

        })
    }

    $scope.removeCategory = function(){
        $http({
            method: 'POST',
            url: '/saveUsers',
            data:{name:$scope.name,
                app:$scope.selectedApp,
                twitter_handle:$scope.twitter_handle,
                insta_handle:$scope.insta_handle,
                profile_pic:$scope.profile_pic,
                oldCategory:$scope.selected,
                edit:($scope.edit==undefined)?false:$scope.edit
            }
        }).success(function(){

        })
    }

    $scope.deleteUser = function(){
        $http({
            method: 'POST',
            url: '/deleteUser',
            data:{_id:($scope.edit==undefined)?-1:$scope.edit}
        }).success(function(){

        })
    }

    $scope.selectUser = function(item){
        if(item.checked) {
            if($scope.lastChecked!=undefined){
                $scope.lastChecked.checked = false;
            }
            $scope.lastChecked = item;
            $scope.name = item.name;
            $scope.twitter_handle = item.twitter_handle;
            $scope.insta_handle = item.insta_handle;
            $scope.profile_pic = item.profile_pic;
            $scope.selectedCategory = $scope.selected;
            $scope.selectedApp = $scope.app;
            $scope.edit = item._id;
        }else{
            $scope.lastChecked = undefined;
            $scope.name = "";
            $scope.twitter_handle = "";
            $scope.insta_handle = "";
            $scope.profile_pic = "";
            $scope.selectedCategory = "";
            $scope.selectedApp = "";
            $scope.edit = false;
        }
    }

    $scope.fetchAllUsers = function(app){
        $http({
            method: 'GET',
            url: '/fetchAllUsers?app='+app
        }).success(function(result){
            $scope.items = result;
            $scope.categories = [];

            for(category in result){
                $scope.categories.push(category);
            }
            $scope.selected = $scope.categories[0];


        });
    }


    $http({
        method: 'GET',
        url: '/fetchAllTwitterHandles'
    }).success(function(result){
        $scope.twitter_handles = result;
    })

    $http({
        method: 'GET',
        url: '/fetchAllInstaHandles'
    }).success(function(result){
        $scope.insta_handles = result;
    })

    $http({
        method: 'GET',
        url: '/fetchApps'
    }).success(function(result){
        $scope.apps = result;
        $scope.app = result[0];
        $scope.fetchAllUsers($scope.app);
    })



});
