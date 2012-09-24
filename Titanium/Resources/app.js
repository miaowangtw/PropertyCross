var propertySearchViewModel = new (require("viewModel/PropertySearchViewModel"))();

function init() {

	var _ = require("underscore");
	var ko = require("knockout");
	var util = require("viewModel/util");
	var propertyDataSource = require("model/PropertyDataSource").Instance;
	var SearchResultsViewModel = require("viewModel/SearchResultsViewModel");
	var SearchResultsView = require("view/SearchResultsView");
	var PropertyView = require("view/PropertyView");
	var application = require("viewModel/ApplicationViewModel").Instance;

	var previousBackStackLength = 0;
	var viewStack = [];

	// subscribe to changes in the current view model, creating
	// the required view
	application.currentViewModel.subscribe(function(viewModel) {
		var backStackLength = application.viewModelBackStack().length, view;

		if (previousBackStackLength < backStackLength) {
			// forward navigation
			var upperCamelCase = viewModel.template[0].toUpperCase() + viewModel.template.substr(1);
			view = new (require("view/" + upperCamelCase))(viewModel);
			viewStack.push(view);
			// Android only - pressing back on the last screen should exit the application
			view.window.addEventListener('android:back', function() {
				if (application.backButtonRequired()) {
					application.back();
				} else {
					Titanium.Android.currentActivity.finish();
				}
			});
			view.window.open();

		} else {
			// backward navigation
			view = viewStack.pop();
			view.window.close();
			view.dispose();
		}

		previousBackStackLength = backStackLength;

	});

	// handle changes in persistent state
	function persistentStateChanged() {
		var state = {
			recentSearches : propertySearchViewModel.recentSearches,
			favourites : propertySearchViewModel.favourites
		}, jsonState = ko.toJSON(state);

		Ti.App.Properties.setString('appState', jsonState);
	}


	propertySearchViewModel.favourites.subscribe(persistentStateChanged);
	propertySearchViewModel.recentSearches.subscribe(persistentStateChanged);

	var state = Ti.App.Properties.getString('appState');
	if (state && ( state = JSON.parse(state))) {
		if (state.favourites) {
			_.each(state.favourites, function(item) {
				propertySearchViewModel.favourites.push(util.hydrateObject(item));
			});
		}
		if (state.recentSearches) {
			_.each(state.recentSearches, function(item) {
				propertySearchViewModel.recentSearches.push(util.hydrateObject(item));
			});
		}
	}

	application.navigateTo(propertySearchViewModel);

}

// self executing anonymous functions break eclipse auto-format...
init();
