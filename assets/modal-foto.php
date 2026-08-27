<div id="crop-avatar">
       
	<!-- Cropping modal -->
  <div class="modal fade" id="avatar-modal" aria-hidden="true" aria-labelledby="avatar-modal-label" role="dialog" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <form class="avatar-form" action="crop.php" enctype="multipart/form-data" method="post">
          <div class="modal-header">
            <h4 class="modal-title">Trocar foto</h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="avatar-body">

              <!-- Upload image and data -->
              <div class="avatar-upload">
                <input class="avatar-src" name="avatar_src" type="hidden">
                <input class="avatar-data" name="avatar_data" type="hidden">
                <label for="avatarInput">Escolher arquivo:</label>
                <input class="avatar-input" id="avatarInputUsu" name="avatar_file" type="file">
              </div>

              <!-- Crop and preview -->
              <div class="row">
                <div class="col-md-9">
                  <div class="avatar-wrapper"></div>
                </div>
                <div class="col-md-3">
                  <div class="avatar-preview preview-lg"></div>
                  <div class="avatar-preview preview-md"></div>
                  <div class="avatar-preview preview-sm"></div>
                </div>
              </div>

              <div class="row avatar-btns">
                <div class="col-md-9">
                  <div class="btn-group">
                    <button class="btn btn-primary" data-method="rotate" data-option="-15" data-toggle="tooltip" data-placement="top" title="Girar -15º" type="button"><i class="fa fa-undo" data-method="rotate" data-option="-15"></i></button>
                    <button class="btn btn-primary" data-method="rotate" data-option="15" data-toggle="tooltip" data-placement="top" title="Girar 15º" type="button"><i class="fas fa-undo fa-flip-horizontal" data-method="rotate" data-option="15"></i></button>
                  </div>
                  <div class="btn-group">
                    <button class="btn btn-primary" data-method="setDragMode" data-option="move" data-toggle="tooltip" data-placement="top" title="Mover Imagem" type="button"><i class="fas fa-arrows-alt" data-method="setDragMode" data-option="move"></i></button>
                    <button class="btn btn-primary" data-method="setDragMode" data-option="crop" data-toggle="tooltip" data-placement="top" title="Selecionar área" type="button"><i class="fas fa-crop" data-method="setDragMode" data-option="crop"></i></button>
                  </div>
                  <div class="btn-group">
                    <button class="btn btn-primary" data-method="zoom" data-option="0.1" data-toggle="tooltip" data-placement="top" title="Mais zoom" type="button"><i class="fas fa-search-plus" data-method="zoom" data-option="0.1"></i></button>
                    <button class="btn btn-primary" data-method="zoom" data-option="-0.1" data-toggle="tooltip" data-placement="top" title="Menos zoom" type="button"><i class="fas fa-search-minus" data-method="zoom" data-option="-0.1"></i></button>
                  </div>
                  <!-- <div class="btn-group">
                    <button class="btn btn-primary fa fa-arrows-h" data-method="scaleX" data-option="-1" data-toggle="tooltip" data-placement="top" title="Espelhar na horizontal" type="button"></button>
                    <button class="btn btn-primary fa fa-arrows-v" data-method="scaleY" data-option="-1" data-toggle="tooltip" data-placement="top" title="Espelhar na vertical" type="button"></button>
                  </div> -->
                  <div class="btn-group">
                    <button class="btn btn-primary" data-method="disable" data-toggle="tooltip" data-placement="top" title="Bloquear edição" type="button"><i class="fas fa-lock" data-method="disable"></i></button>
                    <button class="btn btn-primary" data-method="enable" data-toggle="tooltip" data-placement="top" title="Desbloquear edição" type="button"><i class="fas fa-lock-open" data-method="enable"></i></button>
                  </div>
                  <div class="btn-group">
                    <button class="btn btn-primary" data-method="clear" data-toggle="tooltip" data-placement="top" title="Limpar seleção" type="button"><i class="fas fa-eraser" data-method="clear"></i></button>
                    <button class="btn btn-primary" data-method="reset" data-toggle="tooltip" data-placement="top" title="Desfazer todas as alterações" type="button"><i class="fas fa-sync-alt" data-method="reset"></i></button>
                  </div>
                </div>
                <div class="col-md-3">
                  <button class="btn btn-primary btn-block avatar-save" type="submit">OK</button>
                </div>
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer">
            <button class="btn btn-default" data-dismiss="modal" type="button">Close</button>
          </div> -->
        </form>
      </div>
    </div>
  </div><!-- /.modal -->

</div>