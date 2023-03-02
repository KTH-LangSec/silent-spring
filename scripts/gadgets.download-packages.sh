TARGET_DIR="../benchmark-npm-packages"
NO_PACKAGES_TO_DOWNLOAD=10000

mkdir -p $TARGET_DIR

count=0;
while read line; do
  count=`expr $count + 1`  
  PKG_VERSION="$(echo -e "${line}" | sed -e 's/[[:space:]\"]*//g' | sed -e "s/:/@/")"    
  FOLDER_NAME="$(echo ${PKG_VERSION} | sed 's/\//-/g')"
  if [ -d $TARGET_DIR/$FOLDER_NAME ] 
  then
    echo "Skipping $PKG_VERSION"
  else 
    curl $(npm view ${PKG_VERSION} dist.tarball) --output out.tar.gz
    mkdir $TARGET_DIR/$FOLDER_NAME
    mv out.tar.gz $TARGET_DIR/$FOLDER_NAME
    cd $TARGET_DIR/$FOLDER_NAME
    tar -xzf out.tar.gz
    rm out.tar.gz
#    sudo chmod 777 -R ./package
    cd -
    if [ $count == ${NO_PACKAGES_TO_DOWNLOAD} ]
    then
      break;
    fi
  fi
done <./packages-of-interest.txt
